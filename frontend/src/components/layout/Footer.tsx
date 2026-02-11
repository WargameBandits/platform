function Footer() {
  return (
    <footer className="border-t-2 border-border bg-background py-4">
      <div className="mx-auto max-w-7xl px-4 text-center">
        <p className="font-retro text-base text-muted-foreground">
          BNDT // {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}

export default Footer;
